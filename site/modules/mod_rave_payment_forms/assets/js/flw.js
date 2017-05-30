'use strict';

  var form, redirectUrl;

  jQuery( '.flw-simple-pay-now-form' ).on( 'submit', function(evt) {
    evt.preventDefault();
    form = $("#" + this.id);

    var config = buildConfigObj( this );
    getpaidSetup( config );
  } );

  /**
   * Builds config object to be sent to GetPaid
   *
   * @return object - The config object
   */
  var buildConfigObj = function( form ) {
    var formData = jQuery( form ).data();
    var amount  = formData.amount || jQuery( form ).find( '#flw-amount' ).val();
    var email   = formData.email  || jQuery( form ).find( '#flw-customer-email' ).val();
    var txref   = 'JRF_' + form.id.toUpperCase() + '_' + new Date().valueOf();

    return {
      amount: amount,
      country: formData.country,
      currency: formData.currency,
      custom_description: formData.desc,
      custom_logo: formData.logo,
      custom_title: formData.title,
      customer_email: email,
      PBFPubKey: formData.pbkey,
      txref: txref,
      onclose: function() {
        redirectTo( redirectUrl );
      },
      callback: function(res) {
        sendPaymentRequestResponse( res, formData.module );
      }
    };
  };

  /**
   * Calls saveResponse function and processes the callback
   *
   * @param object Response object from GetPaid
   * @param string Name of the module called
   *
   * @return void
   */
  var sendPaymentRequestResponse = function(res, module) {
    saveResponse(res.tx, module, function(response, error) {
      if(error) return console.log('error: ', error);
      redirectUrl   = response.redirect_url;

      if (!redirectUrl) {
        var responseMsg = ( res.tx.paymentType === 'account' ) ? res.tx.acctvalrespmsg  : res.tx.vbvrespmessage;
        jQuery( form )
          .find( '#notice' )
          .text( responseMsg )
          .removeClass( function() {
            return jQuery( form ).find( '#notice' ).attr( 'class' );
          } )
          .addClass( response.status );
      } else {
        setTimeout( redirectTo, 5000, redirectUrl );
      }
    });
  };

  /**
   * Sends payment response from GetPaid to the endpoint that saves the record
   *
   * @param object Response object from GetPaid passed through sendPaymentRequestResponse
   * @param string Name of the module called passed through sendPaymentRequestResponse
   * @param function Callback to be called when request returns
   *
   * @return void
   */
  var saveResponse = function(data, module, cb) {
    var request = {
      'data'   :  JSON.stringify(data),
      'format' : 'json',
      'module' : 'rave_payment_forms',
      'option' : 'com_ajax',
      'title'  : module,
    };

    jQuery.ajax({
      data   : request,
      type   : 'POST',
      success: function (response) {
        cb(response.data, null);
      },
      error: function(err) {
        cb(null, err);
      }
    });
  };

  /**
   * Redirect to set url
   *
   * @param string url - The link to redirect to
   *
   * @return void
   */
  var redirectTo = function( url ) {
    if (url) {
      location.href = url;
    }
    redirectUrl = null;
  };
